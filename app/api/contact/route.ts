import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { sucesso: false, erro: "Todos os campos (nome, email e dúvidas) são obrigatórios." },
        { status: 400 }
      );
    }

    const host = process.env.SMTP_HOST || "smtp.zoho.com";
    const port = parseInt(process.env.SMTP_PORT || "465", 10);
    const secure = process.env.SMTP_SECURE === "false" ? false : true;
    const user = process.env.SMTP_USER || "atendimento@estoquebi.com.br";
    const pass = process.env.SMTP_PASS;

    // Se as credenciais de SMTP não estiverem configuradas, avisamos no log e retornamos sucesso simulado
    if (!pass) {
      console.warn(
        `⚠️ CONFIGURAÇÃO SMTP EM FALTA: O contato de ${name} (${email}) foi recebido, mas o email real não pôde ser enviado porque SMTP_PASS não está definido nas variáveis de ambiente.`
      );
      console.log(`Dúvidas recebidas: "${message}"`);
      
      return NextResponse.json({
        sucesso: true,
        mensagem: "Sua mensagem foi registrada com sucesso! (Modo de simulação: configure a chave SMTP_PASS em Configurações para envio real).",
        simulado: true,
      });
    }

    // Configurando o transportador para o Zoho Mail
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure, // true para porta 465, false para outras portas
      auth: {
        user,
        pass,
      },
    });

    // Conteúdo HTML profissional do email de contato
    const mailOptions = {
      from: `"${name}" <${user}>`, // Zoho geralmente exige que o remetente coincida com a conta autenticada
      to: "atendimento@estoquebi.com.br",
      replyTo: email, // Permite responder diretamente ao email do usuário que enviou a dúvida
      subject: `[Contato Estoque & BI] Nova dúvida de ${name}`,
      text: `Nome: ${name}\nE-mail de contato: ${email}\n\nDúvida / Mensagem:\n${message}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1f5fe; border-radius: 8px;">
          <h2 style="color: #059669; border-bottom: 2px solid #10b981; padding-bottom: 10px;">Novo Contato Recebido</h2>
          <p style="font-size: 14px; color: #374151;">Você recebeu uma nova mensagem de contato através do site <strong>Estoque & BI Preditivo</strong>.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563; width: 120px;">Nome:</td>
              <td style="padding: 8px 0; color: #1f2937;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">E-mail:</td>
              <td style="padding: 8px 0; color: #1f2937;">
                <a href="mailto:${email}" style="color: #059669; text-decoration: none;">${email}</a>
              </td>
            </tr>
          </table>

          <div style="margin-top: 20px; padding: 15px; bg-color: #f9fafb; border-left: 4px solid #10b981; border-radius: 4px; background-color: #f9fafb;">
            <p style="font-weight: bold; color: #374151; margin-top: 0; margin-bottom: 8px;">Dúvida / Mensagem:</p>
            <p style="color: #4b5563; line-height: 1.6; white-space: pre-wrap; margin: 0;">${message}</p>
          </div>

          <div style="margin-top: 25px; font-size: 11px; color: #9ca3af; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 15px;">
            Este email foi gerado de forma automática e integrada pelo portal Estoque & BI.
          </div>
        </div>
      `,
    };

    // Enviando o email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      sucesso: true,
      mensagem: "Sua mensagem foi enviada com sucesso para nossa equipe!",
      simulado: false,
    });
  } catch (error: any) {
    console.error("Erro ao enviar email pelo Zoho SMTP:", error);
    return NextResponse.json(
      {
        sucesso: false,
        erro: "Falha ao enviar a mensagem. Verifique a configuração de SMTP e tente novamente mais tarde.",
        detalhes: error.message,
      },
      { status: 500 }
    );
  }
}
